import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  static InterstitialAd? _launchAd;
  static RewardedAd? _rewardedAd;

  static String get launchAdUnitId {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'ca-app-pub-3940256099942544/4411468910'; // Test Interstitial ID
    }
    return 'ca-app-pub-3940256099942544/1033173712'; // Test Android Interstitial ID
  }

  static String get rewardedAdUnitId {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'ca-app-pub-3940256099942544/1712485313'; // Test Rewarded ID
    }
    return 'ca-app-pub-3940256099942544/5224354917'; // Test Android Rewarded ID
  }

  // --- STAGE 1: APP LAUNCH INTERSTITIAL ---
  static Future<void> loadLaunchAd() async {
    try {
      await InterstitialAd.load(
        adUnitId: launchAdUnitId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (ad) => _launchAd = ad,
          onAdFailedToLoad: (error) => _launchAd = null,
        ),
      );
    } catch (_) {
      _launchAd = null;
    }
  }

  static void showLaunchAd({required VoidCallback onAdDismissed}) {
    if (_launchAd != null) {
      _launchAd!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          onAdDismissed();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          onAdDismissed();
        },
      );
      _launchAd!.show();
      _launchAd = null;
    } else {
      onAdDismissed();
    }
  }

  // --- STAGE 2: PREMIUM REWARDED VIDEO ---
  static void loadRewardedAd() {
    try {
      RewardedAd.load(
        adUnitId: rewardedAdUnitId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (ad) => _rewardedAd = ad,
          onAdFailedToLoad: (error) => _rewardedAd = null,
        ),
      );
    } catch (_) {
      _rewardedAd = null;
    }
  }

  static void showRewardedAd({required VoidCallback onAdComplete}) {
    if (_rewardedAd != null) {
      _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          loadRewardedAd();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          loadRewardedAd();
          onAdComplete(); // Fail-safe fallback
        },
      );
      _rewardedAd!.show(onUserEarnedReward: (ad, reward) => onAdComplete());
      _rewardedAd = null;
    } else {
      onAdComplete();
      loadRewardedAd();
    }
  }
}
